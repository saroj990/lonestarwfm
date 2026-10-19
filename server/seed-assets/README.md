# Seed check-in photos

Color JPEGs from [Unsplash](https://unsplash.com/license) (free for app/demo use):

- `checkin-primary.jpg` — color field / construction check-in (same image used on login, map modal, and demo uploads)
- `checkin-worker.jpg` — worker at equipment
- `checkin-site.jpg` — active job site

`pnpm seed:demo` copies `checkin-primary.jpg` to `uploads/seed-demo-checkin.jpg`.  
The client fallback image is `client/public/seed/checkin-primary.jpg`.
