import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const getAuthToken = async () => {
  try {
    let token = await AsyncStorage.getItem('supabase_token');
    if (!token) {
      console.warn('No Supabase token found in AsyncStorage. Using mock token for now.');
      token = 'mock_token';
    }
    return token;
  } catch (e) {
    return 'mock_token';
  }
};

const _fetch = async (endpoint, method = 'POST', bodyData = null) => {
  const token = await getAuthToken();
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  };
  if (bodyData) {
    options.body = JSON.stringify(bodyData);
  }

  const res = await fetch(`${API_URL}${endpoint}`, options);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || `Request failed with status ${res.status}`);
  }
  
  return await res.json();
};

export const generateLesson = (topic, difficulty) => _fetch('/v1/ai/lesson', 'POST', { topic, difficulty });
export const generateQuiz = (lesson_id) => _fetch('/v1/ai/quiz', 'POST', { lesson_id });
export const generateNotes = (lesson_id) => _fetch('/v1/ai/notes', 'POST', { lesson_id });
export const generateRetryExplanation = (topic, previous_strategy) => _fetch('/v1/ai/retry', 'POST', { topic, previous_strategy });
export const trackLearnerEvent = (eventData) => _fetch('/v1/ai/learner/event', 'POST', eventData);

export const getLessonProgress = (lesson_id) => _fetch(`/v1/lessons/${lesson_id}/progress`, 'GET');
export const updateLessonProgress = (lesson_id, progress) => _fetch(`/v1/lessons/${lesson_id}/progress`, 'PUT', { progress });
export const submitQuizAttempt = (quiz_id, attemptData) => _fetch(`/v1/quizzes/${quiz_id}/attempts`, 'POST', attemptData);

export const uploadFile = async (fileObj) => {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append('file', {
    uri: fileObj.uri,
    name: fileObj.name || 'upload.pdf',
    type: fileObj.type || 'application/pdf'
  });

  const res = await fetch(\/v1/files, {
    method: 'POST',
    headers: {
      'Authorization': Bearer \,
    },
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || errorData.message || Upload failed with status \);
  }
  return await res.json();
};
