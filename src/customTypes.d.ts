import { Wallet } from './wallet';

declare module 'express-serve-static-core' {
  interface Request {
    wallet?: Wallet
  }
}