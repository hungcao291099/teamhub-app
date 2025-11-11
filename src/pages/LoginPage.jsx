// src/pages/LoginPage.jsx
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth.js"; // Thêm .js
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Email hoặc mật khẩu không đúng.");
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Vui lòng nhập email của bạn vào ô email.");
      setSuccess("");
      return;
    }
    try {
      await resetPassword(email);
      setSuccess("Đã gửi link reset! Vui lòng kiểm tra email.");
      setError("");
    } catch (err) {
      setError("Không tìm thấy email này.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Đăng nhập TeamHub</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input id="password" type="password" required onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            <Button type="submit" className="w-full">
              Đăng nhập
            </Button>
          </form>
          <div className="text-center mt-4">
            <Button type="button" variant="link" onClick={handleResetPassword}>
              Quên mật khẩu?
            </Button>
          </div>
          <p className="mt-4 text-center text-sm">
            Chưa có tài khoản? <Link to="/signup" className="underline">Đăng ký</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}