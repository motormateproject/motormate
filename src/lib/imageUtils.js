// Utility functions for camera and image handling

/**
 * Compress an image file
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width of the compressed image
 * @param {number} maxHeight - Maximum height of the compressed image
 * @param {number} quality - Quality of compression (0-1)
 * @returns {Promise<Blob>}
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
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

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        resolve(blob);
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = (error) => {
                reject(error);
            };
        };

        reader.onerror = (error) => {
            reject(error);
        };
    });
};

/**
 * Convert blob to base64 string
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Upload image to Supabase Storage
 * @param {File|Blob} file - The image file to upload
 * @param {string} bucket - Supabase storage bucket name
 * @param {string} path - Path where to store the file
 * @param {Object} supabase - Supabase client instance
 * @returns {Promise<{url: string, error: any}>}
 */
export const uploadImageToSupabase = async (file, bucket, path, supabase) => {
    try {
        // Compress the image first
        const compressedBlob = await compressImage(file);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, compressedBlob, {
                cacheControl: '3600',
                upsert: true,
            });

        if (error) {
            return { url: null, error };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return { url: urlData.publicUrl, error: null };
    } catch (error) {
        return { url: null, error };
    }
};

/**
 * Validate image file
 * @param {File} file
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {{valid: boolean, error: string}}
 */
export const validateImageFile = (file, maxSizeMB = 5) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (!validTypes.includes(file.type)) {
        return { valid: false, error: 'Please select a valid image file (JPEG, PNG, or WebP)' };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
    }

    return { valid: true, error: null };
};
