# Kemalreis API

## Local setup

1. Copy `.env.example` to `.env`.
2. Put your MongoDB Atlas connection string in `MONGODB_URI`.
3. Install dependencies with `npm install` inside the `server` folder.
4. Start the API with `npm run dev`.
5. Start the Vite frontend from the project root with `npm run dev`.

The frontend sends local `/api` requests through the Vite proxy to `http://localhost:5000`.

## Main endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:productKey`
- `POST /api/orders`
- `GET /api/orders/:orderNumber?email=customer@example.com`

Order totals are recalculated on the server from the MongoDB product catalog. Client-submitted prices and totals are ignored.
