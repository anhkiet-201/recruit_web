# Kiểm tra swap hiện tại
sudo swapon --show

# Tạo file swap 2GB
sudo fallocate -l 2G /swapfile

# Phân quyền (quan trọng)
sudo chmod 600 /swapfile

# Thiết lập swap
sudo mkswap /swapfile
sudo swapon /swapfile

# Cấu hình để tự động mount khi reboot
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Tinh chỉnh Swappiness (giảm việc dùng swap quá sớm)
# Giá trị 10 nghĩa là chỉ dùng swap khi RAM thực còn dưới 10%
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

echo "Đã tạo Swap 2GB thành công!"