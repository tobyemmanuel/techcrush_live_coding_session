import multer from "multer";

const tempStorage = multer.diskStorage({
  destination: "uploads/temp",
  filename: (req, file, cb) => {
    cb(null, `temp-${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: tempStorage });
export default { upload, tempStorage };
