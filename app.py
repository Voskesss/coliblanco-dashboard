from flask import Flask, send_from_directory, request, jsonify
import os

app = Flask(__name__, static_folder='dist')

# Serveer de statische bestanden van de React-app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# API-endpoint voorbeeld (voor toekomstige backend-functionaliteit)
@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({'message': 'Hallo van de Python backend!'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
