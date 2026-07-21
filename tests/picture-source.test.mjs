import assert from "node:assert/strict";
import test from "node:test";

import { configurePictureImage } from "../js/picture-source.js";

test("configurePictureImage prefers WebP and falls back to PNG", () => {
  const image = { src: "", style: {} };
  const source = {
    srcset: "",
    removeAttribute(name) {
      assert.equal(name, "srcset");
      this.srcset = "";
    },
  };

  configurePictureImage({
    image,
    source,
    webpPath: "portrait.webp",
    fallbackPath: "portrait.png",
  });

  assert.equal(source.srcset, "portrait.webp");
  assert.equal(image.src, "portrait.png");

  image.onerror();
  assert.equal(source.srcset, "");
  assert.equal(image.src, "portrait.png");

  image.onerror();
  assert.equal(image.style.display, "none");
});

test("configurePictureImage hides a missing fallback without a source", () => {
  const image = { src: "", style: {} };

  configurePictureImage({
    image,
    source: null,
    webpPath: "portrait.webp",
    fallbackPath: "portrait.png",
  });
  image.onerror();

  assert.equal(image.style.display, "none");
});
