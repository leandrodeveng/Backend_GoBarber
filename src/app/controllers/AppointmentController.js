import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';
import Appointment from '../models/appointment';
import User from '../models/user';

class AppointmentController {
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
      return res.status(400).json({ error: 'Past date aren not permited' });
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
      user_id: req.id,
      provider_id,
      date: hourStart,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
