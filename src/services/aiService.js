const API_URL = process.env.EXPO_PUBLIC_API_URL;
console.log("API_URL:", API_URL);
console.log("ENV:", process.env.EXPO_PUBLIC_API_URL);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

//const API_URL = "http://10.64.248.61:3000";
// Prefer EXPO_PUBLIC_API_URL env var; fall back to platform-specific localhost for dev
// const API_URL =
//   process.env.EXPO_PUBLIC_API_URL ||
//   (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('supabase_token');
    if (!token) {
      throw new Error('Not authenticated. Please sign in.');
    }
    return token;
  } catch (e) {
    throw e instanceof Error ? e : new Error('Not authenticated. Please sign in.');
  }
};

const _fetch = async (endpoint, method = 'POST', bodyData = null) => {
  const token = await getAuthToken();
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
  if (bodyData && method !== 'GET') {
    options.body = JSON.stringify(bodyData);
  }

  const res = await fetch(`${API_URL}${endpoint}`, options);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || errorData.message || `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.code = errorData.error?.code || errorData.code;
    throw err;
  }

  return await res.json();
};

export const generateLesson = (topic, difficulty) => _fetch('/v1/ai/lesson', 'POST', { topic, difficulty });
export const generateQuiz = (lesson_id) => _fetch('/v1/ai/quiz', 'POST', { lesson_id });
export const generateNotes = (lesson_id) => _fetch('/v1/ai/notes', 'POST', { lesson_id });
export const generateRetryExplanation = (topic, previous_strategy) => _fetch('/v1/ai/retry', 'POST', { topic, previous_strategy });
export const generateVisualExplanation = (topic, lesson_id) => _fetch('/v1/ai/visual', 'POST', { topic, lesson_id });
export const generateMoreExamples = (topic, lesson_id) => _fetch('/v1/ai/examples', 'POST', { topic, lesson_id });
export const trackLearnerEvent = (eventData) => _fetch('/v1/ai/learner/event', 'POST', eventData);

export const getLessonProgress = (lesson_id) => _fetch(`/v1/lessons/${lesson_id}/progress`, 'GET');
export const updateLessonProgress = (lesson_id, progress) => _fetch(`/v1/lessons/${lesson_id}/progress`, 'PUT', { progress });
export const submitQuizAttempt = (quiz_id, attemptData) => _fetch(`/v1/quizzes/${quiz_id}/attempts`, 'POST', attemptData);

export const fetchBackendNotes = () => _fetch('/v1/notes', 'GET');
export const fetchBackendLessons = () => _fetch('/v1/lessons', 'GET');

export const uploadFile = async (fileObj) => {
  if (!fileObj || !fileObj.uri) {
    throw new Error('Invalid file selected');
  }

  const fileResponse = await fetch(fileObj.uri);
  const blob = await fileResponse.blob();

  const formData = new FormData();
  formData.append('file', blob, fileObj.name || 'upload.jpg');

  const res = await fetch(`${API_URL}/v1/files`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.log("UPLOAD ERROR:", text);
    throw new Error("Upload failed. Try again.");
  }

  return await res.json();
};
