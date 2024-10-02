// import { Dict, isObject } from '@epdoc/typeutil';
// import { Logger } from '../core';

// /**
//  * Stub for express.request object, used when passing request object around when simulating req/res/next flow.
//  * @param name Define the name to use for your own 'locals' (private variables).
//  * @param options The object to attach to req[name], defaults to {}.
//  * @return A request object
//  */

// export function expressRequestStub(options: Dict) {
//   return new ExpressRequestStub(options);
// }

// export class ExpressRequestStub {
//   log: Logger = new Logger('express.stub');
//   constructor(options: Dict) {
//     let startTime = new Date().getTime();
//     if (isObject(options)) {
//       for (let propName in options) {
//         this[propName] = options[propName];
//       }
//     }
//   }
// }
