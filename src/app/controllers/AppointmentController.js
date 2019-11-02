import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/appointment';
import User from '../models/user';
import File from '../models/file';
import Notification from '../schemas/Notification';
import Queue from '../../lib/queue';
import CancellationMail from '../jobs/cancellationMail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'url', 'path'],
            },
          ],
        },
      ],
    });
    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      date: Yup.date().required(),
      provider_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Invalid Information' });
    }

    const { provider_id, date } = req.body;

    // Check if "provider_id" is a provider

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!(await isProvider)) {
      return res
        .status(401)
        .json({ error: 'You can only create appoinments with providers' });
    }

    // Verificações de Datas e Hora

    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      // Verifica se a data passada está antes do dia atual
      return res.status(400).json({ error: 'Past date are not permited' });
    }

    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    const user = await User.findByPk(req.userId);
    const formatedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às ' H:mm'h'",
      {
        locale: pt,
      }
    );

    await Notification.create({
      content: `Novo Agendamento ${user.name} para ${formatedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointments = await Appointment.findOne({
      where: { id: req.params.id, user_id: req.userId, canceled_at: null },
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (!appointments) {
      return res.status(401).json({ error: 'You dont have this appointment' });
    }

    const dateWithSub = subHours(appointments.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res
        .status(401)
        .json({ error: 'You can only cancel appointments 2 hours in advance' });
    }

    appointments.canceled_at = new Date();

    await appointments.save();

    await Queue.add(CancellationMail.key, {
      appointments,
    });

    return res.json(appointments);
  }
}

export default new AppointmentController();
