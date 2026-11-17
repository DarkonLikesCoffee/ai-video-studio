# Video engine public assets

Place local media files in this folder and reference them from a project scene using:

```json
{
  "media": {
    "type": "image",
    "source": "public",
    "src": "assets/network-orbit.svg",
    "fit": "cover",
    "position": "center",
    "alt": "Abstract network globe illustration"
  }
}
```

Paths are relative to this `public/` directory and must stay inside `assets/`.
Supported local images: PNG, JPG, JPEG, WebP, SVG.
Supported local video clips: MP4, WebM, MOV.

You can also use a direct public HTTPS URL by setting `source` to `remote`.
Remote assets must be publicly accessible without embedded credentials. Prefer stable hosts that allow automated downloads. The render job needs network access to remote assets.
