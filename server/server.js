import app from "../api/index.js";

const port = Number(process.env.PORT || 3001);
const server = app.listen(port, () => console.log(`Node API listening on http://localhost:${port}`));
const shutdown = async () => { server.close(() => process.exit(0)); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
