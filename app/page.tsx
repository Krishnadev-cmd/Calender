// app/secret/page.js
import { redirect } from 'next/navigation';

export default function SecretPage() {
  redirect('/dashboard');
}