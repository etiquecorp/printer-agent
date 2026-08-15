import { z } from "zod";

export const loginSchema = z.object({
  login: z.string().min(1, "E-mail ou usuário obrigatório"),
  password: z.string().min(1, "Senha obrigatória"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
