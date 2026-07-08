import app from "./index";

const port = parseInt(process.env.PORT || "5000");

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is listening on port ${port}`);
});
