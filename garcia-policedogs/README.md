# Garcia Policedogs

Marketing website for Garcia Policedogs (Enschede) — africhting & fokkerij van werklijn
Nederlandse Herders. Standalone Astro project, independent from the Tastory site in this
repository.

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build
npm run preview
```

## Content notes

- Copy is based on the real content currently published on garciapolicedogs.nl (about-me,
  my-breeding and contact pages) plus the existing logo assets in `public/`.
- There are no photos of the dogs/kennel available yet — the design intentionally avoids stock
  photography and relies on the logo mark and typography instead. Swap in real photos where
  useful once available.
- The contact form posts to `https://formsubmit.co/ajax/info@garciapolicedogs.nl`. The first real
  submission triggers a one-time confirmation email from FormSubmit that the inbox owner needs to
  click to activate delivery.
