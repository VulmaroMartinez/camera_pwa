if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(registration => {
                        console.log('Service Worker registrado con éxito:', registration);
                    })
                    .catch(error => {
                        console.error('Error al registrar el Service Worker:', error);
                    });
            });
        }


// Referencias a elementos del DOM

const openCameraBtn = document.getElementById('openCamera');
const toggleCameraBtn = document.getElementById('toggleCamera');
const cameraContainer = document.getElementById('cameraContainer');
const video = document.getElementById('video');
const takePhotoBtn = document.getElementById('takePhoto');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d'); // Contexto 2D para dibujar en el Canvas
const gallery = document.getElementById('gallery');

let stream = null; // Variable para almacenar el MediaStream de la cámara
let currentFacingMode = 'environment';
let hasFront = false;
const photos = []; // array para guardar dataURLs de las fotos

// --- 2.2. Función openCamera(): Activación de la Cámara ---

async function openCamera() {
    try {
        // 1. Definición de Restricciones (Constraints)
        // usar currentFacingMode para cambiar entre 'environment' y 'user'
        const constraints = {
            video: {
                facingMode: { ideal: currentFacingMode },
                width: { ideal: 320 },
                height: { ideal: 240 }
            }
        };

        // 2. Obtener el Stream de Medios
        // Si ya hay un stream abierto, cerrarlo antes de abrir uno nuevo
        if (stream) {
            closeCamera(false);
        }

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // 3. Asignar el Stream al Elemento <video>
        video.srcObject = stream;
        
        // 4. Detectar cámaras disponibles después de obtener permisos
        await detectFrontCamera();
        
        // 5. Actualización de la UI
        cameraContainer.style.display = 'block';
        openCameraBtn.textContent = 'Cámara Abierta';
        openCameraBtn.disabled = true;
        // Mostrar botón de alternar cámara si existe cámara frontal
        if (hasFront) toggleCameraBtn.style.display = 'inline-block';
        
        console.log('Cámara abierta exitosamente');
        console.log('Cámaras disponibles:', hasFront ? 'Frontal y trasera' : 'Solo una cámara');
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        alert('No se pudo acceder a la cámara. Asegúrate de dar permisos.');
    }
}


function takePhoto() {
    if (!stream) {
        alert('Primero debes abrir la cámara');
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataURL = canvas.toDataURL('image/png');
    
    console.log('Foto capturada en base64:', imageDataURL.length, 'caracteres');
    canvas.style.display = 'block';

    // Añadir la foto a la galería
    photos.push(imageDataURL);
    addThumbnailToGallery(imageDataURL);
}


function closeCamera(keepCanvas = false) {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null; 

        video.srcObject = null;
        cameraContainer.style.display = 'none';
        
        // Solo ocultar el canvas si no pedimos mantenerlo
        if (!keepCanvas) {
            canvas.style.display = 'none';
        }
        
        openCameraBtn.textContent = 'Abrir Cámara';
        openCameraBtn.disabled = false;
        toggleCameraBtn.style.display = 'none';
        
        console.log('Cámara cerrada');
    }
}


openCameraBtn.addEventListener('click', openCamera);
takePhotoBtn.addEventListener('click', takePhoto);

// Agregar lógica para alternar cámara
toggleCameraBtn.addEventListener('click', async () => {
    // Si no existe cámara frontal simplemente ignorar
    if (!hasFront) return;
    // alternar
    currentFacingMode = (currentFacingMode === 'environment') ? 'user' : 'environment';
    // reiniciar cámara si está abierta
    await openCamera();
});

// Añadir miniatura a la galería
function addThumbnailToGallery(dataURL) {
    const img = document.createElement('img');
    img.src = dataURL;
    img.className = 'thumb';
    img.alt = 'Foto tomada';
    img.addEventListener('click', () => {
        // al hacer click mostrar la imagen en el canvas como preview
        const image = new Image();
        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            canvas.style.display = 'block';
        };
        image.src = dataURL;
    });

    gallery.appendChild(img);
    // desplazar la galería hacia la derecha para mostrar la última miniatura
    gallery.scrollLeft = gallery.scrollWidth;
}

// Detectar si existe cámara frontal (simple heurística: más de 1 videoinput)
async function detectFrontCamera() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        console.log('Dispositivos de video encontrados:', videoInputs.length);
        if (videoInputs.length > 1) {
            hasFront = true;
            console.log('Se detectaron múltiples cámaras');
        } else {
            hasFront = false;
            console.log('Solo se detectó una cámara');
        }
    } catch (err) {
        console.warn('No se pudo enumerar dispositivos:', err);
        hasFront = false;
    }
}

// Inicializar detección al cargar el script
detectFrontCamera();

window.addEventListener('beforeunload', () => {
    closeCamera(); // default = ocultar canvas al salir
});