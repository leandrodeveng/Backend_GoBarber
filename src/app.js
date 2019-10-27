import expresss from 'express';
import path from 'path';
import routes from './routes';
import './database';

class App {
  constructor() {
    this.server = expresss();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.server.use(expresss.json());
    this.server.use(
      '/files',
      expresss.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );
  }

  routes() {
    this.server.use(routes);
  }
}

export default new App().server;
