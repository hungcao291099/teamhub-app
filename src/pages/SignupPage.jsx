// src/pages/SignupPage.jsx
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth.js";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signup(email, password, name, phone);
      navigate("/"); // Tự động login và chuyển về Dashboard
    } catch (err) {
      setError("Lỗi khi tạo tài khoản. Email có thể đã tồn tại.");
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Đăng ký</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên</Label>
              <Input id="name" type="text" required onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Điện thoại</Label>
              <Input id="phone" type="tel" onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu (tối thiểu 6 ký tự)</Label>
              <Input id="password" type="password" required onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">
              Đăng ký
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Đã có tài khoản? <Link to="/login" className="underline">Đăng nhập</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}