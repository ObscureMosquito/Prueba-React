# Dashboard React y FastAPI

Una aplicación web que muestra un pequeño dashboard utilizando React en el frontend y FastAPI en el backend. Para la autenticación con AWS Cognito se utiliza un servidor de python con apis rest expuestas para hacer de intermiediario, y proover y verificar tokens JWT al cliente entre otras cosas.

## 📦 Instalación y Configuración

### **Dependencias**

- **Node.js**
- **Python**
- **FastAPI** y dependencias
- **AWS Cognito** configurado (datos en archivo .env)

### Clonar el repositorio y instalar dependencias

```bash
git clone https://github.com/ObscureMosquito/Prueba-React.git
cd React-Prueba/react-prueba
npm install
cd ../fastapi-auth
pip install -r requirements.txt
```

### Ejecutar el server de python

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4 --reload
```

### Ejecutar el server Node/Vite

```bash
npm run dev
```

## Explicación

El servidor de python hace de intermediario con la API de AWS Cognito, el cliente web de React se conecta a este servidor de python para el registro, log in, verificar correo y refresco de token JWT, la aplicacion web react solo permite acceder al directorio protegido /home a clientes autenticados por el servidor.

(Es posible acceder a home con injeccion de scripts del lado de cliente, pero no seria posible acceder a datos sensibles (como el correo) sin la JWT asociada, ya que estas estan protegidas por lado de servidor)
