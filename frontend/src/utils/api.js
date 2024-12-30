// @ts-nocheck
import axios from 'axios';
import { appConfig } from '../config/appConfig';

const instance = axios.create({ baseURL: appConfig.apiBase });

export default instance;
