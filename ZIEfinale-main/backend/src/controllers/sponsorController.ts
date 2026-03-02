import { Response } from 'express';
import { Application } from '../models/Application';
import { AuthRequest } from '../middleware/auth';

export const submitRefereeAppraisal = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;
    const { question1, question2, question3, question4, question5, question6, question7, question8 } =
      req.body;

    // Find application by referee token
    const application = await Application.findOne({ 'sponsors.appraisalToken': token });

    if (!application) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }

    // Find the referee and update response
    const referee = application.sponsors.find((s: any) => s.appraisalToken === token);
    if (!referee) {
      return res.status(404).json({ message: 'Referee not found' });
    }

    referee.responses = {
      question1,
      question2,
      question3,
      question4,
      question5,
      question6,
      question7,
      question8,
    };

    referee.submittedAt = new Date();
    referee.isConfidential = true;

    await application.save();

    res.json({
      message: 'Appraisal submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting appraisal:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getRefereeAppraisal = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;

    const application = await Application.findOne({ 'sponsors.appraisalToken': token }).select(
      'personalParticulars chosenGrade sponsors'
    );

    if (!application) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }

    const referee = application.sponsors.find((s: any) => s.appraisalToken === token);
    if (!referee) {
      return res.status(404).json({ message: 'Referee not found' });
    }

    res.json({
      applicantName: `${application.personalParticulars.firstName} ${application.personalParticulars.lastName}`,
      grade: application.chosenGrade,
      hasResponded: !!referee.responses,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
