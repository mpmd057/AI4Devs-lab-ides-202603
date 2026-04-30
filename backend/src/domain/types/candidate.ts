export type CandidateEducationInput = {
  institution: string;
  title: string;
  startDate: string;
  endDate?: string;
};

export type CandidateWorkExperienceInput = {
  company: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string;
};

export type CandidateCvInput = {
  filePath: string;
  fileType: string;
};

export type CreateCandidateInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  educations?: CandidateEducationInput[];
  workExperiences?: CandidateWorkExperienceInput[];
  cv?: CandidateCvInput;
};

export type CreateCandidateResponse = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};
