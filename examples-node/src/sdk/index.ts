/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { IMessageProtocol } from '@univerjs/rpc';
import type { Serializable } from 'node:child_process';
import { fork } from 'node:child_process';
import path from 'node:path';
import { Univer } from '@univerjs/core';
import { UniverDataValidationPlugin } from '@univerjs/data-validation';
import { UniverDocsPlugin } from '@univerjs/docs';
import { UniverDocsDrawingPlugin } from '@univerjs/docs-drawing';
import { UniverDrawingPlugin } from '@univerjs/drawing';
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
import { UniverRPCNodeMainPlugin } from '@univerjs/rpc-node';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsConditionalFormattingPlugin } from '@univerjs/sheets-conditional-formatting';
import { UniverSheetsDataValidationPlugin } from '@univerjs/sheets-data-validation';
import { UniverSheetsDrawingPlugin } from '@univerjs/sheets-drawing';
import { UniverSheetsFilterPlugin } from '@univerjs/sheets-filter';
import { UniverSheetsHyperLinkPlugin } from '@univerjs/sheets-hyper-link';
import { UniverSheetsSortPlugin } from '@univerjs/sheets-sort';
import { UniverThreadCommentPlugin } from '@univerjs/thread-comment';
import { Observable, shareReplay } from 'rxjs';

export function createUniverOnNode(): Univer {
    const univer = new Univer();

    registerBasicPlugins(univer);
    reigsterSharedPlugins(univer);
    registerRPCPlugin(univer);

    registerDocPlugins(univer);
    registerSheetPlugins(univer);

    return univer;
}

function registerBasicPlugins(univer: Univer): void {
    univer.registerPlugin(UniverFormulaEnginePlugin, { notExecuteFormula: true });
}

function reigsterSharedPlugins(univer: Univer): void {
    univer.registerPlugin(UniverThreadCommentPlugin);
    univer.registerPlugin(UniverDrawingPlugin);
}

function registerDocPlugins(univer: Univer): void {
    univer.registerPlugin(UniverDocsPlugin);
    univer.registerPlugin(UniverDocsDrawingPlugin);
}

function registerSheetPlugins(univer: Univer): void {
    univer.registerPlugin(UniverSheetsPlugin);
    univer.registerPlugin(UniverSheetsConditionalFormattingPlugin);
    univer.registerPlugin(UniverDataValidationPlugin);
    univer.registerPlugin(UniverSheetsDataValidationPlugin);
    univer.registerPlugin(UniverSheetsFilterPlugin);
    univer.registerPlugin(UniverSheetsHyperLinkPlugin);
    univer.registerPlugin(UniverSheetsDrawingPlugin);
    univer.registerPlugin(UniverSheetsSortPlugin);
}

function registerRPCPlugin(univer: Univer): void {
    const childFork = fork(path.join(__dirname, './worker.js'));
    const messageProtocol: IMessageProtocol = {
        send(message: unknown): void {
            childFork.send(message as Serializable);
        },
        onMessage: new Observable<any>((subscriber) => {
            const handler = (message: unknown) => {
                subscriber.next(message);
            };

            childFork.on('message', handler);
            return () => childFork.off('message', handler);
        }).pipe(shareReplay(1)),
    };

    univer.registerPlugin(UniverRPCNodeMainPlugin, { messageProtocol });
}