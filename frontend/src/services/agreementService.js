import api from './api.js';

const BASE_URL = '/agreements/v1';

// UC16 / UC18 – Confirm Tutoring Agreement & Contracts
export const getConnections = async () => {
  const response = await api.get(BASE_URL);
  return response.data;
};

export const proposeAgreement = async (data) => {
  const response = await api.post(`${BASE_URL}/propose`, data);
  return response.data;
};

export const confirmAgreement = async (agreementId, action) => {
  const response = await api.post(`${BASE_URL}/${agreementId}/confirm`, { action });
  return response.data;
};

export const rateTutor = async (agreementId, payload) => {
  const response = await api.post(`${BASE_URL}/${agreementId}/rate`, payload);
  return response.data;
};
