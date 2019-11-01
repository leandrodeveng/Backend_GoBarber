import Notification from '../schemas/Notification';
import User from '../models/user';

class NotificationController {
  async index(req, res) {
    const chekIsProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!chekIsProvider) {
      return res.status(401).json({ error: 'User is not a provider' });
    }

    const notifications = await Notification.find({
      user: req.userId,
    })
      .sort({ createdAt: 'desc' })
      .limit(20);

    return res.json(notifications);
  }
}

export default new NotificationController();
