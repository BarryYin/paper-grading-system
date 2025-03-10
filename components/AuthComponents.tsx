'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

interface User {
  user_id: string;
  username: string;
  email: string;
}

interface AuthComponentsProps {
  onAuthChange?: (isAuthenticated: boolean, user?: User) => void;
}

const AuthComponents: React.FC<AuthComponentsProps> = ({ onAuthChange }) => {
  const router = useRouter();
  const { isAuthenticated, user, loading, login, register: registerUser, logout } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('login');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // 表单状态
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', email: '' });
  
  const { toast } = useToast();

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(loginForm.username, loginForm.password);
      
      if (success) {
        setIsDialogOpen(false);
        // 确保在显示toast前已经获取到最新的用户信息
        const currentUser = user || { username: loginForm.username };
        toast({
          title: "登录成功",
          description: `欢迎回来，${currentUser.username}！`,
        });
        if (onAuthChange) onAuthChange(true, currentUser as User);
      } else {
        toast({
          title: "登录失败",
          description: "用户名或密码错误",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('登录失败:', error);
      toast({
        title: "登录失败",
        description: "服务器错误，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await registerUser(registerForm.username, registerForm.password, registerForm.email);
      
      if (success) {
        setIsDialogOpen(false);
        toast({
          title: "注册成功",
          description: "请使用新账号登录",
        });
        // 自动填充登录表单并准备下次打开时显示登录页
        setActiveTab('login');
        setLoginForm({
          username: registerForm.username,
          password: registerForm.password
        });
      } else {
        toast({
          title: "注册失败",
          description: "注册过程中出现错误",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('注册失败:', error);
      toast({
        title: "注册失败",
        description: "服务器错误，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      const success = await logout();
      
      if (success) {
        toast({
          title: "已登出",
          description: "您已成功退出登录",
        });
        if (onAuthChange) onAuthChange(false);
        window.location.href = '/'; // 强制刷新并跳转首页
      } else {
        toast({
          title: "登出失败",
          description: "服务器错误，请稍后再试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('登出失败:', error);
      toast({
        title: "登出失败",
        description: "服务器错误，请稍后再试",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="auth-components">
      {isAuthenticated ? (
        <div className="flex items-center gap-4">
          <span className="text-sm">欢迎，{user?.username}</span>
          <Button variant="outline" onClick={handleLogout}>登出</Button>
        </div>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">登录 / 注册</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">登录</TabsTrigger>
                <TabsTrigger value="register">注册</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-4">
                <form onSubmit={handleLogin}>
                  <DialogHeader>
                    <DialogTitle>用户登录</DialogTitle>
                    <DialogDescription>
                      请输入您的用户名和密码登录系统。
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="login-username">用户名</Label>
                      <Input
                        id="login-username"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="login-password">密码</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "登录中..." : "登录"}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="mt-4">
                <form onSubmit={handleRegister}>
                  <DialogHeader>
                    <DialogTitle>用户注册</DialogTitle>
                    <DialogDescription>
                      创建一个新账号以使用系统功能。
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="register-username">用户名</Label>
                      <Input
                        id="register-username"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="register-email">电子邮箱</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="register-password">密码</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "注册中..." : "注册"}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AuthComponents;