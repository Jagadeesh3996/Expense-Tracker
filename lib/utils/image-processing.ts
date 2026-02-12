/**
 * Compresses an image and converts it to WebP format.
 * @param file The original image file.
 * @param quality Compression quality (0 to 1). Default is 0.8.
 * @param maxWidth Maximum width of the compressed image. Default is 800.
 * @param maxHeight Maximum height of the compressed image. Default is 800.
 */
export async function compressImage(
    file: File,
    quality: number = 0.8,
    maxWidth: number = 800,
    maxHeight: number = 800
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error("Canvas toBlob failed"));
                        }
                    },
                    "image/webp",
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}
