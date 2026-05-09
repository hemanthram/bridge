# bridge
Find the deployed app [here](https://bridge007.netlify.app/).

# Contributors
[J Kaousheik](https://github.com/kaousheik)

[Hemanth Ram](https://github.com/hemanthram)

[Tamil Sudaravan](https://github.com/SudaravanM)

## Backend Deploy (Render)

This repo includes a `render.yaml` blueprint for deploying the backend from `server/`.

Set the following Render environment variables:

- `CLIENT_ORIGIN`: frontend URL(s) allowed by CORS. Use comma-separated values for multiple origins.
- `PORT`: optional (Render injects this automatically).
- `REACT_APP_API_URL`: backend URL used by the frontend build (for example `https://bridge-twoz.onrender.com`).
