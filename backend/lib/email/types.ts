/** Sanitised contact-form submission shared by API + email templates. */
export type Enquiry = {
  name: string;
  email: string;
  company: string;
  phone: string;
  projectType: string;
  budget: string;
  message: string;
  receivedAt: Date;
};
