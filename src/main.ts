import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#worldCanvas");

if (canvas) {
  canvas.width = 800;
  canvas.height = 600;
} else {
  alert("Your browser doesn't support canvas");
}
