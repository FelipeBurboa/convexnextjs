import { z } from "zod";

export const signinSchema = z.object({
  email: z.string().email({
    message: "Debe ingresar un correo electrónico válido.",
  }),
  password: z.string().min(8, {
    message: "La contraseña debe tener al menos 8 caracteres.",
  }),
});

export type AuthFormValues = z.infer<typeof signinSchema>;
