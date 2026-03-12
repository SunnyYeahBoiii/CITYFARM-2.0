from flask import Flask
import os
app = Flask("Hello World API")


@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


@app.route("/hello")
def hello():
    return "<p>Hello, World! from hello</p>"


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3002))
    print(port)
    app.run(host="0.0.0.0", port=port, debug=True)
