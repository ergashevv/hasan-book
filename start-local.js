require("dotenv").config();
const app = require("./server");

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`Server ishga tushdi: http://localhost:${port}`);
});
