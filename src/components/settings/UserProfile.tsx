import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";

export const UserProfile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    title: "",
    bio: "",
    avatar: ""
  });

  const handleSave = () => {
    // TODO: Implement profile save logic
    toast({
      title: "资料已保存",
      description: "您的用户资料已成功更新",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatar} />
          <AvatarFallback className="text-lg">
            {profile.name.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <Button variant="outline" size="sm">
            上传头像
          </Button>
          <p className="text-sm text-muted-foreground mt-1">
            支持 JPG, PNG 格式，最大 2MB
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">姓名</Label>
          <Input
            id="name"
            value={profile.name}
            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
            placeholder="请输入您的姓名"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
            placeholder="请输入您的邮箱"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">电话</Label>
          <Input
            id="phone"
            value={profile.phone}
            onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="请输入您的电话号码"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">部门</Label>
          <Input
            id="department"
            value={profile.department}
            onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))}
            placeholder="请输入您的部门"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">职位</Label>
          <Input
            id="title"
            value={profile.title}
            onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
            placeholder="请输入您的职位"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">个人简介</Label>
        <Textarea
          id="bio"
          value={profile.bio}
          onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="简单介绍一下您自己..."
          rows={4}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          保存资料
        </Button>
      </div>
    </div>
  );
};