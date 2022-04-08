const e = require('express');
const path = require('path');
const { Worker, isMainThread } = require('worker_threads');

const pathToResizeWorker = path.resolve(__dirname, 'resizeWorker.js');
const pathToMonochromeWorker = path.resolve(__dirname, 'monochromeWorker.js');

function imageProcessor(filename) {
    let resizeWorkerFinished = false;
    let monochromeWorkerFinished = false;

    return new Promise((resolve, reject) => {
        const sourcePath = uploadPathResolver(filename);
        const resizedDestination = uploadPathResolver(`resized-${filename}`);
        const monochromeDestination = uploadPathResolver(`monochrome-${filename}`);

        if (isMainThread) {
            try {
                const resizeWorker = new Worker(
                    pathToResizeWorker, 
                    {
                        workerData: { 
                            source: sourcePath, 
                            destination: resizedDestination 
                        } 
                    }
                );
                const monochromeWorker = new Worker(
                    pathToMonochromeWorker,
                    {
                        workerData: { 
                            source: sourcePath, 
                            destination: monochromeDestination 
                        } 
                    }
                );

                resizeWorker.on('message', (message) => {
                    resizeWorkerFinished = true;
                    if (monochromeWorkerFinished) {
                        return resolve('resizeWorker finished processing');
                    }
                });
                resizeWorker.on('error', (error) => {
                    return reject(new Error(error.message))
                });
                resizeWorker.on('exit', (code) => {
                    if (code !== 0) {
                        return reject(new Error(`Exited with status code ${code}`));
                    }
                });
                monochromeWorker.on('message', (message) => {
                    monochromeWorkerFinished= true;
                    if (resizeWorkerFinished) {
                        return resolve('monochromeWorker finished processing');
                    }
                });
                monochromeWorker.on('error', (error) => {
                    return reject(new Error(error.message))
                });
                monochromeWorker.on('exit', (code) => {
                    if (code !== 0) {
                        return reject(new Error(`Exited with status code ${code}`));
                    }
                });
            } catch {
                reject();
            }
        } else {
            reject(new Error('not on main thread'));
        }
    });
}

function uploadPathResolver(filename) {
    return path.resolve(__dirname, '../uploads', filename);
}

module.exports = imageProcessor;