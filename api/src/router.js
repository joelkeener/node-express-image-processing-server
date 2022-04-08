const { Router } = require('express');
const router = Router();

const multer = require('multer');
const storage = multer.diskStorage({ destination: 'api/uploads/', filename: filename });

function filename(request, file, callback) {
    callback(null, file.originalname);
}

function fileFilter(request, file, callback) {
    if (file.mimetype !== 'image/png') {
        const strErrorMsg = 'Wrong file type';
        request.fileValidationError = strErrorMsg;
        return callback(null, false, new Error(strErrorMsg));
    }
    callback(null, true);
}

const upload = multer({ fileFilter: fileFilter, storage: storage });

router.post('/upload', upload.single('photo'), (request, response) => { 
    if (request.fileValidationError) {
        return response.status(400).json({ error: request.fileValidationError });
    }
    response.status(201).end();
});

module.exports = router;