import axios from 'axios';
import { HttpRequestError } from '../core/errors.js';

export const createHttpClient = ({ baseURL, timeout = 10000 } = {}) =>
  axios.create({ baseURL, timeout, headers: { 'Content-Type': 'application/json' } });

export const requestWithHandling = async (client, config) => {
  try {
    const response = await client.request(config);
    return response.data;
  } catch (error) {
    const meta = {
      status: error.response?.status,
      data: error.response?.data
    };
    throw new HttpRequestError(error.message || 'HTTP request failed', meta);
  }
};
