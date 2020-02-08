import axios, {AxiosInstance} from 'axios';

console.log(process.env.NODE_ENV);
const env = process.env.NODE_ENV === 'production'
  ? require('../environment/prod.env')
  : require('../environment/dev.env');

console.log(env);

export class GameApiClient {
  cli: AxiosInstance;

  constructor(cli: AxiosInstance) {
    this.cli = cli;
  }
}

export function getGameApiClient() {
  const cli = axios.create({
    baseURL: env.SEVER_HOST,
    timeout: 1000,
  });
  return new GameApiClient(cli);
}
