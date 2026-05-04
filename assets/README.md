# SALT art assets

`art_manifest.json` and `art_manifest.js` define optional local image slots. The app runs without images; empty or missing paths fall back to CSS gradient placeholders.

## Slots

- `backgrounds.default`
- `backgrounds.result`
- `avatars.default`
- `avatars.S_plus`
- `avatars.A_plus`
- `avatars.L_plus`
- `avatars.T_plus`
- `badges.specialness`
- `badges.action`
- `badges.long_range`
- `badges.two_wayness`
- `badges.practical`
- `badges.emotional`
- `badges.creative`
- `badges.presence`
- `result_cards.default`
- `type_illustrations["S+A+L+T+"]` and the other 15 SALT type codes

## Type illustrations

Add a local image path to both `assets/art_manifest.json` and `assets/art_manifest.js`:

```json
{
  "type_illustrations": {
    "S+A+L+T+": "assets/types/S+A+L+T+.png"
  }
}
```

For REF角色立绘, put files in `img/` and map names in `data/role_images.json` plus `data/role_images.js`.

Do not use CDN or remote image URLs if the app must keep working offline and by double-clicking `index.html`.
