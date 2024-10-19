// import { Dict, Integer, isFunction } from '@epdoc/typeutil';
// import { Request } from 'express';

// /**
//  * Stub for express.response object, used when passing response object around for logging purposes
//  * @param req The request object, will be attached to res.
//  * @param onSend
//  */

// export type PopRouteInfoFunction = (opts?: Dict) => void;

// export class ExpressResponseStub {
//   req: any;
//   onSend: any;
//   statusCode: number;
//   popRouteInfo: PopRouteInfoFunction;
//   /**
//    * Set onSend to your callback function if you want onSend to do anything, or you need a callback.
//    * Or you can rely on the responseLogger to log that the send occurred.
//    * @param req
//    * @param onSend - Set onSend to your callback function if you want onSend to do anything, or you need a callback.
//    */
//   constructor(req: Request, onSend: any) {
//     this.req = req;
//     this.onSend = onSend;
//   }

//   status(n: Integer): this {
//     this.statusCode = n;
//     return this;
//   }

//   send(...args: any[]): this {
//     if (isFunction(this.popRouteInfo)) {
//       this.popRouteInfo();
//     }
//     if (isFunction(this.onSend)) {
//       this.onSend(...args);
//     }
//     return this;
//   }

//   json(...args: any[]): this {
//     if (isFunction(this.popRouteInfo)) {
//       this.popRouteInfo({ all: true });
//     }
//     if (isFunction(this.onSend)) {
//       this.onSend(...args);
//     }
//     return this;
//   }
// }
