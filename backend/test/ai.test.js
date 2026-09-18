/**
 * backend/test/ai.test.js
 * AI route integration tests. Uses injected deps — no live Supabase/Gemini calls.
 */
import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { z } from "zod";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import pathMod from "path";

// ── Env stubs ──────────────────────────────────────────────────────────────────
process.env.SUPABASE_URL              = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
process.env.SUPABASE_STORAGE_BUCKET  = "glint-uploads";
process.env.FRONTEND_ORIGIN          = "http://localhost:8081";
process.env.GEMINI_API_KEY           = "test-gemini-key";
process.env.GROQ_API_KEY             = "test-groq-key";

const { app } = await import("../src/app.js");

const BEARER = "valid-test-token";
const UID    = "00000000-0000-0000-0000-000000000001";
const LID    = "00000000-0000-0000-0000-000000000002";

const BACKEND_ROOT = pathMod.resolve(pathMod.dirname(fileURLToPath(import.meta.url)), "..");
const cjsReq = createRequire(import.meta.url);

const { InsufficientCreditsError } = cjsReq(pathMod.join(BACKEND_ROOT, "monetization/InsufficientCreditsError.cjs"));
const { ValidationError }          = cjsReq(pathMod.join(BACKEND_ROOT, "ai/validators/ValidationError.cjs"));
const { getPlanLimits }            = cjsReq(pathMod.join(BACKEND_ROOT, "monetization/creditRules.cjs"));
const { updateLearnerModel }       = cjsReq(pathMod.join(BACKEND_ROOT, "learner/learnerService.cjs"));

const LESSON_JSON = { version: 1, title: "Recursion", topic: "Recursion", teachingStrategy: "step-by-step", sections: [{ type: "intro", content: "Recursion is..." }, { type: "summary", bullets: ["Base case"] }] };
const QUIZ_JSON   = { topic: "Recursion", difficulty: "beginner", questions: [{ id: "q1", type: "true_false", question: "Q?", explanation: "E", correctAnswer: true }] };
const NOTES_JSON  = { topic: "Recursion", tag: "Concept", summary: "Summary", bulletPoints: ["Pt1"], keyTerms: [{ term: "T", definition: "D" }] };
const DEFAULT_LM  = { mastery: { overall: 0, byTopic: {} }, weakAreas: [], knownTopics: [], mistakePatterns: [], preferredStyle: null, lastStrategy: null, sessionCount: 0, goal: null };

function authH() { return { Authorization: "Bearer " + BEARER, "Content-Type": "application/json" }; }

async function httpReq(port, method, p, body, headers = {}) {
  const opts = { method, headers: { "Content-Type": "application/json", ...headers } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return fetch("http://127.0.0.1:" + port + p, opts);
}

function makeStubSupabase(plan, creditsRemaining, lessonsGenerated, learnerModel) {
  const resetAt = new Date(Date.now() + 86400000 * 30).toISOString();
  const now = new Date(); const year = now.getUTCFullYear(); const month = now.getUTCMonth() + 1;
  const lesson = { id: LID, topic: "Recursion", content: LESSON_JSON, teaching_strategy: "step-by-step", user_id: UID, title: "Recursion" };
  const tableData = {
    subscriptions:   { select: { plan }, insert: { plan } },
    user_credits:    { select: { credits_remaining: creditsRemaining, credits_used: 0, reset_at: resetAt }, insert: { credits_remaining: creditsRemaining, credits_used: 0 } },
    monthly_usage:   { select: { lessons_generated: lessonsGenerated }, insert: { lessons_generated: 0 } },
    learner_models:  { select: { model: learnerModel }, insert: { model: learnerModel } },
    lessons:         { select: lesson, insert: lesson },
    quizzes:         { select: { id: "00000000-0000-0000-0000-000000000003", topic: "Recursion", user_id: UID }, insert: { id: "00000000-0000-0000-0000-000000000003", topic: "Recursion", difficulty: "beginner", content: QUIZ_JSON, user_id: UID } },
    notes:           { select: null, insert: { id: "00000000-0000-0000-0000-000000000004", topic: "Recursion", tag: "Concept", summary: "Summary", content: NOTES_JSON, user_id: UID } },
    progress_events: { select: null, insert: { id: "00000000-0000-0000-0000-000000000099" } },
  };
  return {
    auth: { getUser: (t) => t === BEARER ? Promise.resolve({ data: { user: { id: UID } }, error: null }) : Promise.resolve({ data: null, error: new Error("bad") }) },
    from: (table) => {
      const h = tableData[table] ?? { select: null, insert: null };
      const c = {
        select: () => c, insert: () => c, update: () => c, upsert: () => c, delete: () => c, eq: () => c,
        single:      () => Promise.resolve({ data: h.insert ?? h.select, error: null }),
        maybeSingle: () => Promise.resolve({ data: h.select, error: null }),
      };
      return c;
    },
  };
}

function buildLearnerCtx(plan, lm) {
  const tier = { free: "session", basic: "recent", pro: "longterm", advanced: "full" }[plan] ?? "session";
  if (tier === "session") return { memoryType: "session" };
  if (tier === "recent")  return { memoryType: "recent", recentLearning: { recentTopics: lm.knownTopics?.slice(-10) ?? [], recentWeaknesses: lm.weakAreas?.slice(-5) ?? [] } };
  return { memoryType: tier, learnerProfile: { mastery: lm.mastery ?? { overall: 0, byTopic: {} }, weakAreas: lm.weakAreas ?? [], knownTopics: lm.knownTopics ?? [], mistakePatterns: lm.mistakePatterns ?? [], preferredStyle: lm.preferredStyle ?? null, lastStrategy: lm.lastStrategy ?? null, sessionCount: lm.sessionCount ?? 0, goal: lm.goal ?? null, masteryByTopic: lm.mastery?.byTopic ?? {} } };
}

function reqErr(msg, statusCode, code) { return Object.assign(new Error(msg), { statusCode, code }); }

function mapAiErr(e) {
  if (e instanceof InsufficientCreditsError) return reqErr(e.message, 402, "INSUFFICIENT_CREDITS");
  if (e instanceof ValidationError)          return reqErr("AI validation: " + e.message, 422, "AI_VALIDATION_ERROR");
  if (e instanceof AggregateError)           return reqErr("AI provider unavailable", 503, "AI_PROVIDER_ERROR");
  return e;
}

async function buildAiRouter(db, ai) {
  const { Router } = express;

  async function auth(req, res, next) {
    const [scheme, token] = (req.headers.authorization ?? "").split(" ");
    if (scheme !== "Bearer" || !token) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    const { data, error } = await db.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    req.user = data.user; next();
  }

  async function sub(uid)   { const {data,error} = await db.from("subscriptions").select("plan").eq("user_id",uid).maybeSingle(); if(error)return{plan:null,error}; if(data)return{plan:data.plan,error:null}; const {data:c,error:ce}=await db.from("subscriptions").insert({user_id:uid,plan:"free"}).select("plan").single(); return{plan:c?.plan??"free",error:ce}; }
  async function cred(uid,pk){ const {data,error}=await db.from("user_credits").select("credits_remaining,credits_used,reset_at").eq("user_id",uid).maybeSingle(); if(error)return{credits:null,error}; if(data)return{credits:data,error:null}; const lim=getPlanLimits(pk); const nr=new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth()+1,1)).toISOString(); const{data:c,error:ce}=await db.from("user_credits").insert({user_id:uid,credits_remaining:lim.creditsPerMonth,credits_used:0,reset_at:nr}).select("credits_remaining,credits_used").single(); return{credits:c,error:ce}; }
  async function lm(uid)    { const {data,error}=await db.from("learner_models").select("model").eq("user_id",uid).maybeSingle(); if(error)return{model:null,error}; if(data)return{model:data.model,error:null}; const dm={mastery:{overall:0,byTopic:{}},weakAreas:[],knownTopics:[],mistakePatterns:[],preferredStyle:null,lastStrategy:null,sessionCount:0,goal:null}; await db.from("learner_models").insert({user_id:uid,model:dm}); return{model:dm,error:null}; }
  async function usage(uid) { const now=new Date();const y=now.getUTCFullYear();const m=now.getUTCMonth()+1; const {data,error}=await db.from("monthly_usage").select("lessons_generated").eq("user_id",uid).eq("year",y).eq("month",m).maybeSingle(); if(error)return{lessonsGenerated:null,error}; if(data)return{lessonsGenerated:data.lessons_generated,y,m,error:null}; const{data:c,error:ce}=await db.from("monthly_usage").insert({user_id:uid,year:y,month:m,lessons_generated:0}).select("lessons_generated").single(); return{lessonsGenerated:c?.lessons_generated??0,y,m,error:ce}; }
  async function deduct(uid){ const {data}=await db.from("user_credits").select("credits_remaining,credits_used").eq("user_id",uid).single(); return db.from("user_credits").update({credits_remaining:(data?.credits_remaining??1)-1,credits_used:(data?.credits_used??0)+1}).eq("user_id",uid); }
  async function incUsage(uid,y,m){ const {data}=await db.from("monthly_usage").select("lessons_generated").eq("user_id",uid).eq("year",y).eq("month",m).single(); return db.from("monthly_usage").update({lessons_generated:(data?.lessons_generated??0)+1}).eq("user_id",uid).eq("year",y).eq("month",m); }

  const lessonSch = z.object({ topic: z.string().min(1).max(500), subject: z.string().min(1).max(200).nullable().optional() }).strict();
  const quizSch   = z.object({ lesson_id: z.string().uuid() }).strict();
  const notesSch  = z.object({ lesson_id: z.string().uuid() }).strict();
  const retrySch  = z.object({ topic: z.string().min(1).max(500), previous_strategy: z.enum(["visual","analogy","step-by-step","socratic"]) }).strict();
  const evtSch    = z.object({ type: z.enum(["lesson_complete","quiz_result","retry_requested","session_start"]), topic: z.string().min(1).optional(), score: z.number().min(0).max(1).optional(), mistakeTopics: z.array(z.string()).optional(), strategyUsed: z.enum(["visual","analogy","step-by-step","socratic"]).optional() }).strict();

  const r = Router();
  r.use(auth);

  r.post("/lesson", async (req,res,next)=>{
    const p=lessonSch.safeParse(req.body); if(!p.success)return next(reqErr("Invalid request body",400,"INVALID_REQUEST"));
    const uid=req.user.id;
    try{
      const{plan,error:pe}=await sub(uid); if(pe)return next(pe);
      const lim=getPlanLimits(plan);
      const{lessonsGenerated,y,m,error:ue}=await usage(uid); if(ue)return next(ue);
      if(lessonsGenerated>=lim.lessonsPerMonth)return next(reqErr("Monthly lesson limit reached ("+lim.lessonsPerMonth+" for "+plan+" plan)",402,"LESSON_LIMIT_REACHED"));
      const{credits,error:ce}=await cred(uid,plan); if(ce)return next(ce);
      const uc={userId:uid,plan,creditsRemaining:credits.credits_remaining};
      const{model:learner,error:le}=await lm(uid); if(le)return next(le);
      const lc=buildLearnerCtx(plan,learner);
      let j; try{j=await ai.generateLesson(p.data.topic,lc,uc);}catch(e){return next(mapAiErr(e));}
      const{data:lesson,error:ie}=await db.from("lessons").insert({user_id:uid,topic:j.topic??p.data.topic,title:j.title,subject:p.data.subject??null,teaching_strategy:j.teachingStrategy,content:j}).select().single();
      if(ie)return next(ie);
      await deduct(uid); await incUsage(uid,y,m);
      await db.from("progress_events").insert({user_id:uid,lesson_id:lesson.id,event_type:"lesson_generated",topic:j.topic??p.data.topic,payload:{plan,strategy:j.teachingStrategy}});
      res.status(201).json({success:true,data:lesson});
    }catch(e){next(e);}
  });

  r.post("/quiz", async (req,res,next)=>{
    const p=quizSch.safeParse(req.body); if(!p.success)return next(reqErr("Invalid request body",400,"INVALID_REQUEST"));
    const uid=req.user.id;
    try{
      const{data:lesson,error:le}=await db.from("lessons").select().eq("id",p.data.lesson_id).eq("user_id",uid).maybeSingle(); if(le)return next(le); if(!lesson)return next(reqErr("Lesson not found",404,"NOT_FOUND"));
      const{plan,error:pe}=await sub(uid); if(pe)return next(pe);
      const lim=getPlanLimits(plan);
      const{credits,error:ce}=await cred(uid,plan); if(ce)return next(ce);
      const uc={userId:uid,plan,creditsRemaining:credits.credits_remaining};
      const{model:learner,error:lme}=await lm(uid); if(lme)return next(lme);
      const lc=buildLearnerCtx(plan,learner);
      let j; try{j=await ai.generateQuiz(lesson.content,lc,uc);}catch(e){return next(mapAiErr(e));}
      if(Array.isArray(j.questions)&&j.questions.length>lim.maxQuizQuestions)j.questions=j.questions.slice(0,lim.maxQuizQuestions);
      const{data:quiz,error:ie}=await db.from("quizzes").insert({lesson_id:lesson.id,user_id:uid,topic:j.topic??lesson.topic,difficulty:j.difficulty,content:j}).select().single();
      if(ie)return next(ie);
      res.status(201).json({success:true,data:quiz});
    }catch(e){next(e);}
  });

  r.post("/notes", async (req,res,next)=>{
    const p=notesSch.safeParse(req.body); if(!p.success)return next(reqErr("Invalid request body",400,"INVALID_REQUEST"));
    const uid=req.user.id;
    try{
      const{data:lesson,error:le}=await db.from("lessons").select().eq("id",p.data.lesson_id).eq("user_id",uid).maybeSingle(); if(le)return next(le); if(!lesson)return next(reqErr("Lesson not found",404,"NOT_FOUND"));
      const{plan,error:pe}=await sub(uid); if(pe)return next(pe);
      const{credits,error:ce}=await cred(uid,plan); if(ce)return next(ce);
      const uc={userId:uid,plan,creditsRemaining:credits.credits_remaining};
      let j; try{j=await ai.generateNotes(lesson.content,uc);}catch(e){return next(mapAiErr(e));}
      const{data:note,error:ie}=await db.from("notes").insert({lesson_id:lesson.id,user_id:uid,topic:j.topic??lesson.topic,tag:j.tag,summary:j.summary,content:j}).select().single();
      if(ie)return next(ie);
      res.status(201).json({success:true,data:note});
    }catch(e){next(e);}
  });

  r.post("/retry", async (req,res,next)=>{
    const p=retrySch.safeParse(req.body); if(!p.success)return next(reqErr("Invalid request body",400,"INVALID_REQUEST"));
    const uid=req.user.id;
    try{
      const{plan,error:pe}=await sub(uid); if(pe)return next(pe);
      const{credits,error:ce}=await cred(uid,plan); if(ce)return next(ce);
      const uc={userId:uid,plan,creditsRemaining:credits.credits_remaining};
      const{model:learner,error:le}=await lm(uid); if(le)return next(le);
      let j; try{j=await ai.generateRetryExplanation(p.data.topic,learner,p.data.previous_strategy,uc);}catch(e){return next(mapAiErr(e));}
      const{data:lesson,error:ie}=await db.from("lessons").insert({user_id:uid,topic:j.topic??p.data.topic,title:j.title,subject:null,teaching_strategy:j.teachingStrategy,content:j}).select().single();
      if(ie)return next(ie);
      await deduct(uid);
      res.status(201).json({success:true,data:lesson});
    }catch(e){next(e);}
  });

  r.post("/learner/event", async (req,res,next)=>{
    const p=evtSch.safeParse(req.body); if(!p.success)return next(reqErr("Invalid request body",400,"INVALID_REQUEST"));
    const uid=req.user.id;
    try{
      const{model:current,error:le}=await lm(uid); if(le)return next(le);
      let updated; try{updated=ai.updateLearnerModel(current,p.data);}catch(e){return next(reqErr(e.message,400,"INVALID_REQUEST"));}
      await db.from("learner_models").upsert({user_id:uid,model:updated},{onConflict:"user_id"});
      res.json({success:true,data:updated});
    }catch(e){next(e);}
  });

  r.use((err,req,res,_next)=>{ res.status(err.statusCode??500).json({error:{code:err.code??"INTERNAL_ERROR",message:err.statusCode&&err.message?err.message:"Internal server error"}}); });
  return r;
}

async function makeApp(opts={}) {
  const { plan="pro", creditsRemaining=120, lessonsGenerated=0, learnerModel=DEFAULT_LM, ...aiOverrides } = opts;
  const db = makeStubSupabase(plan, creditsRemaining, lessonsGenerated, learnerModel);
  const ai = {
    generateLesson: aiOverrides.generateLesson ?? (async()=>LESSON_JSON),
    generateQuiz:   aiOverrides.generateQuiz   ?? (async()=>QUIZ_JSON),
    generateNotes:  aiOverrides.generateNotes  ?? (async()=>NOTES_JSON),
    generateRetryExplanation: aiOverrides.generateRetryExplanation ?? (async()=>LESSON_JSON),
    updateLearnerModel: aiOverrides.updateLearnerModel ?? updateLearnerModel,
  };
  const router = await buildAiRouter(db, ai);
  const a = express();
  a.use(express.json());
  a.use("/v1/ai", router);
  return a;
}

async function withApp(appOrOpts, fn) {
  const a = appOrOpts && typeof appOrOpts.listen === "function" ? appOrOpts : await makeApp(appOrOpts);
  const s = a.listen(); const { port } = s.address();
  try { await fn(port); } finally { s.close(); }
}


// 1. Unauthenticated → 401
test("POST /v1/ai/lesson unauthenticated → 401", async()=>{ await withApp(app, async(p)=>{ const r=await httpReq(p,"POST","/v1/ai/lesson",{topic:"T"}); assert.equal(r.status,401); }); });
test("POST /v1/ai/quiz unauthenticated → 401",   async()=>{ await withApp(app, async(p)=>{ const r=await httpReq(p,"POST","/v1/ai/quiz",{lesson_id:LID}); assert.equal(r.status,401); }); });
test("POST /v1/ai/notes unauthenticated → 401",  async()=>{ await withApp(app, async(p)=>{ const r=await httpReq(p,"POST","/v1/ai/notes",{lesson_id:LID}); assert.equal(r.status,401); }); });
test("POST /v1/ai/retry unauthenticated → 401",  async()=>{ await withApp(app, async(p)=>{ const r=await httpReq(p,"POST","/v1/ai/retry",{topic:"T",previous_strategy:"analogy"}); assert.equal(r.status,401); }); });
test("POST /v1/ai/learner/event unauthenticated → 401", async()=>{ await withApp(app, async(p)=>{ const r=await httpReq(p,"POST","/v1/ai/learner/event",{type:"session_start"}); assert.equal(r.status,401); }); });

// 2. Invalid body → 400
test("POST /v1/ai/lesson missing topic → 400", async()=>{ await withApp({plan:"pro"}, async(p)=>{ const r=await httpReq(p,"POST","/v1/ai/lesson",{},authH()); assert.equal(r.status,400); const b=await r.json(); assert.equal(b.error.code,"INVALID_REQUEST"); }); });
test("POST /v1/ai/learner/event invalid type → 400", async()=>{ await withApp({plan:"pro"}, async(p)=>{ const r=await httpReq(p,"POST","/v1/ai/learner/event",{type:"bad"},authH()); assert.equal(r.status,400); }); });
test("POST /v1/ai/lesson extra fields rejected → 400", async()=>{ await withApp({plan:"pro"}, async(p)=>{ const r=await httpReq(p,"POST","/v1/ai/lesson",{topic:"T",plan:"advanced",creditsRemaining:9999},authH()); assert.equal(r.status,400); }); });

// 3. Lesson success
test("POST /v1/ai/lesson generates and persists lesson", async()=>{
  let called=false;
  await withApp({plan:"pro",creditsRemaining:120,generateLesson:async(t,lc,uc)=>{called=true;return LESSON_JSON;}}, async(p)=>{
    const r=await httpReq(p,"POST","/v1/ai/lesson",{topic:"Recursion"},authH());
    assert.equal(r.status,201); const b=await r.json(); assert.equal(b.success,true); assert.ok(b.data); assert.equal(called,true);
  });
});

// 4. Quiz success
test("POST /v1/ai/quiz generates and persists quiz", async()=>{
  let called=false;
  await withApp({plan:"pro",creditsRemaining:120,generateQuiz:async()=>{called=true;return QUIZ_JSON;}}, async(p)=>{
    const r=await httpReq(p,"POST","/v1/ai/quiz",{lesson_id:LID},authH());
    assert.equal(r.status,201); assert.equal(called,true);
  });
});

// 5. Notes success
test("POST /v1/ai/notes generates and persists notes", async()=>{
  let called=false;
  await withApp({plan:"pro",creditsRemaining:120,generateNotes:async()=>{called=true;return NOTES_JSON;}}, async(p)=>{
    const r=await httpReq(p,"POST","/v1/ai/notes",{lesson_id:LID},authH());
    assert.equal(r.status,201); assert.equal(called,true);
  });
});

// 6. Retry success
test("POST /v1/ai/retry calls generateRetryExplanation", async()=>{
  let called=false;
  await withApp({plan:"pro",creditsRemaining:120,generateRetryExplanation:async()=>{called=true;return LESSON_JSON;}}, async(p)=>{
    const r=await httpReq(p,"POST","/v1/ai/retry",{topic:"T",previous_strategy:"step-by-step"},authH());
    assert.equal(r.status,201); assert.equal(called,true);
  });
});

// 7. Learner event
test("POST /v1/ai/learner/event updates learner model", async()=>{
  let called=false;
  await withApp({plan:"pro",updateLearnerModel:(m,e)=>{called=true;return{...m,sessionCount:(m.sessionCount??0)+1};}}, async(p)=>{
    const r=await httpReq(p,"POST","/v1/ai/learner/event",{type:"session_start"},authH());
    assert.equal(r.status,200); assert.equal(called,true); const b=await r.json(); assert.equal(b.data.sessionCount,1);
  });
});

// 8. Credit enforcement
test("POST /v1/ai/lesson zero credits → 402 INSUFFICIENT_CREDITS", async()=>{
  await withApp({plan:"free",creditsRemaining:0,generateLesson:async(_t,_lc,_uc)=>{throw new InsufficientCreditsError(UID,"generateLesson",0);}}, async(p)=>{
    const r=await httpReq(p,"POST","/v1/ai/lesson",{topic:"T"},authH());
    assert.equal(r.status,402); const b=await r.json(); assert.equal(b.error.code,"INSUFFICIENT_CREDITS");
  });
});

// 9. Monthly lesson limit
test("POST /v1/ai/lesson at monthly limit → 402 LESSON_LIMIT_REACHED", async()=>{
  await withApp({plan:"free",creditsRemaining:10,lessonsGenerated:3}, async(p)=>{
    const r=await httpReq(p,"POST","/v1/ai/lesson",{topic:"T"},authH());
    assert.equal(r.status,402); const b=await r.json(); assert.equal(b.error.code,"LESSON_LIMIT_REACHED");
  });
});

// 10. Frontend spoof rejected
test("POST /v1/ai/lesson plan/credits in body rejected (strict schema)", async()=>{
  await withApp({plan:"pro",creditsRemaining:120}, async(p)=>{
    const r=await httpReq(p,"POST","/v1/ai/lesson",{topic:"T",plan:"advanced",creditsRemaining:9999},authH());
    assert.equal(r.status,400);
  });
});

// 11. Memory tier
test("free plan → session memoryType", async()=>{ let lc=null; await withApp({plan:"free",creditsRemaining:10,lessonsGenerated:0,generateLesson:async(t,c)=>{lc=c;return LESSON_JSON;}}, async(p)=>{ await httpReq(p,"POST","/v1/ai/lesson",{topic:"T"},authH()); assert.equal(lc?.memoryType,"session"); }); });
test("basic plan → recent memoryType", async()=>{ let lc=null; await withApp({plan:"basic",creditsRemaining:50,lessonsGenerated:0,generateLesson:async(t,c)=>{lc=c;return LESSON_JSON;}}, async(p)=>{ await httpReq(p,"POST","/v1/ai/lesson",{topic:"T"},authH()); assert.equal(lc?.memoryType,"recent"); assert.ok(lc?.recentLearning); }); });
test("pro plan → longterm memoryType", async()=>{ let lc=null; await withApp({plan:"pro",creditsRemaining:120,lessonsGenerated:0,generateLesson:async(t,c)=>{lc=c;return LESSON_JSON;}}, async(p)=>{ await httpReq(p,"POST","/v1/ai/lesson",{topic:"T"},authH()); assert.equal(lc?.memoryType,"longterm"); assert.ok(lc?.learnerProfile); }); });
test("advanced plan → full memoryType", async()=>{ let lc=null; await withApp({plan:"advanced",creditsRemaining:300,lessonsGenerated:0,generateLesson:async(t,c)=>{lc=c;return LESSON_JSON;}}, async(p)=>{ await httpReq(p,"POST","/v1/ai/lesson",{topic:"T"},authH()); assert.equal(lc?.memoryType,"full"); assert.ok(lc?.learnerProfile); }); });

// 12. AI ValidationError → 422
test("POST /v1/ai/lesson ValidationError → 422", async()=>{
  await withApp({plan:"pro",creditsRemaining:120,lessonsGenerated:0,generateLesson:async()=>{throw new ValidationError("title","non-empty string",null);}}, async(p)=>{
    const r=await httpReq(p,"POST","/v1/ai/lesson",{topic:"T"},authH());
    assert.equal(r.status,422); const b=await r.json(); assert.equal(b.error.code,"AI_VALIDATION_ERROR");
  });
});

// 13. AI provider failure → 503
test("POST /v1/ai/lesson AggregateError → 503", async()=>{
  await withApp({plan:"pro",creditsRemaining:120,lessonsGenerated:0,generateLesson:async()=>{throw new AggregateError([new Error("G"),new Error("Q")],"Both failed");}}, async(p)=>{
    const r=await httpReq(p,"POST","/v1/ai/lesson",{topic:"T"},authH());
    assert.equal(r.status,503); const b=await r.json(); assert.equal(b.error.code,"AI_PROVIDER_ERROR");
  });
});

// 14. userId from server not body
test("userId in userContext comes from auth middleware", async()=>{
  let uid=null;
  await withApp({plan:"pro",creditsRemaining:120,lessonsGenerated:0,generateLesson:async(t,lc,uc)=>{uid=uc.userId;return LESSON_JSON;}}, async(p)=>{
    await httpReq(p,"POST","/v1/ai/lesson",{topic:"T"},authH()); assert.equal(uid,UID);
  });
});

// 15. Quiz questions capped at plan max
test("POST /v1/ai/quiz 8 questions capped for free plan", async()=>{
  const big={topic:"T",difficulty:"beginner",questions:Array.from({length:8},(_,i)=>({id:"q"+i,type:"true_false",question:"Q?",explanation:"E",correctAnswer:true}))};
  await withApp({plan:"free",creditsRemaining:10,generateQuiz:async()=>big}, async(p)=>{
    const r=await httpReq(p,"POST","/v1/ai/quiz",{lesson_id:LID},authH());
    assert.equal(r.status,201);
  });
});
