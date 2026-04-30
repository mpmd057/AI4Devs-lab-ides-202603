import { Prisma } from '@prisma/client';
import { DuplicateEmailError, InternalServerError } from '../../domain/errors/candidateErrors';
import { CreateCandidateInput, CreateCandidateResponse } from '../../domain/types/candidate';
import { prisma } from '../prisma';

export async function createCandidateRecord(
  data: CreateCandidateInput
): Promise<CreateCandidateResponse> {
  try {
    const created = await prisma.candidate.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        educations: data.educations
          ? {
              create: data.educations.map((education) => ({
                institution: education.institution,
                title: education.title,
                startDate: new Date(education.startDate),
                endDate: education.endDate ? new Date(education.endDate) : null,
              })),
            }
          : undefined,
        workExperiences: data.workExperiences
          ? {
              create: data.workExperiences.map((workExperience) => ({
                company: workExperience.company,
                position: workExperience.position,
                description: workExperience.description,
                startDate: new Date(workExperience.startDate),
                endDate: workExperience.endDate ? new Date(workExperience.endDate) : null,
              })),
            }
          : undefined,
        resumes: data.cv
          ? {
              create: {
                filePath: data.cv.filePath,
                fileType: data.cv.fileType,
              },
            }
          : undefined,
      },
    });

    return {
      id: created.id,
      firstName: created.firstName,
      lastName: created.lastName,
      email: created.email,
      phone: created.phone,
      address: created.address,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new DuplicateEmailError();
    }

    throw new InternalServerError();
  }
}
