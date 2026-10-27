import { localeOf } from "@/lib/api/locale";
import { createContactMessage } from "@/lib/api/mock/service";

/** Mock: POST a contact message. 201 on success, 422 with field errors (in ?locale=) otherwise. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const res = await createContactMessage(body, localeOf(request));
  return Response.json(res.body, { status: res.status });
}
