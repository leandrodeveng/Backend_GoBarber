import expresss from 'express';
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
  }

  routes() {
    this.server.use(routes);
  }
}

export default new App().server;
