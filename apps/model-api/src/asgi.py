from asgiref.wsgi import WsgiToAsgi

from .wsgi import app as wsgi_app

app = WsgiToAsgi(wsgi_app)
