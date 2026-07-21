export function configurePictureImage({ image, source, webpPath, fallbackPath }) {
  let triedFallback = false;

  image.onerror = () => {
    if (source && !triedFallback) {
      triedFallback = true;
      source.removeAttribute("srcset");
      image.src = fallbackPath;
      return;
    }

    image.style.display = "none";
  };

  if (source) {
    source.srcset = webpPath;
  }
  image.src = fallbackPath;
}
