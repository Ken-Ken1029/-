// personal.js - 模块化版本使用事件委托

class UserProfile {
    constructor() {
        this.initEventListeners();
        this.fetchUserData();
    }

    initEventListeners() {
        // 使用事件委托处理所有按钮点击
        document.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (!button) return;

            const action = button.dataset.action;
            const field = button.dataset.field;

            switch (action) {
                case 'show-edit':
                    this.showEditForm(field);
                    break;
                case 'hide-edit':
                    this.hideEditForm(field);
                    break;
                case 'update-profile':
                    this.updateProfile(field);
                    break;
                case 'update-password':
                    this.updatePassword();
                    break;
            }
        });
    }

    showEditForm(field) {
        // 隐藏当前字段的修改按钮
        const editButton = document.querySelector(`button[data-action="show-edit"][data-field="${field}"]`);
        if (editButton) {
            editButton.classList.add('hidden');
        }

        // 显示编辑表单
        const editForm = document.getElementById(`${field}-edit`);
        if (editForm) {
            editForm.style.display = 'block';
        }

        // 预填充当前值（密码除外）
        if (field !== 'password') {
            const displayElement = document.getElementById(`${field}-display`);
            const inputElement = document.getElementById(`${field}-input`);
            if (displayElement && inputElement) {
                inputElement.value = displayElement.textContent;
            }
        }
    }

    hideEditForm(field) {
        // 隐藏编辑表单
        const editForm = document.getElementById(`${field}-edit`);
        if (editForm) {
            editForm.style.display = 'none';
        }

        // 显示当前字段的修改按钮
        const editButton = document.querySelector(`button[data-action="show-edit"][data-field="${field}"]`);
        if (editButton) {
            editButton.classList.remove('hidden');
        }
    }

    async fetchUserData() {
        try {
            const username = this.getCurrentUsername();
            const response = await this.callApi('/get_user_data', { username });

            if (response.success) {
                this.updateDisplayFields(response.user);
            } else {
                this.showAlert('获取用户数据失败: ' + response.message);
            }
        } catch (error) {
            this.handleFetchError('获取用户数据', error);
        }
    }

    updateDisplayFields(user) {
        const fields = ['username', 'realname', 'class', 'studentid'];
        fields.forEach(field => {
            const element = document.getElementById(`${field}-display`);
            if (element) {
                element.textContent = user[field] || '未设置';
            }
        });
    }

    async updatePassword() {
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;

        if (!oldPassword || !newPassword) {
            this.showAlert('请填写原密码和新密码');
            return;
        }

        try {
            const response = await this.callApi('/update_password', {
                username: this.getCurrentUsername(),
                old_password: oldPassword,
                new_password: newPassword
            });

            if (response.success) {
                this.showAlert('密码修改成功');
                this.hideEditForm('password');
                document.getElementById('old-password').value = '';
                document.getElementById('new-password').value = '';
            } else {
                this.showAlert('密码修改失败: ' + response.message);
            }
        } catch (error) {
            this.handleFetchError('修改密码', error);
        }
    }

    async updateProfile(field) {
        const inputElement = document.getElementById(`${field}-input`);
        if (!inputElement) return;

        const value = inputElement.value.trim();
        if (!value) {
            this.showAlert('请输入有效值');
            return;
        }

        try {
            const response = await this.callApi('/update_profile', {
                username: this.getCurrentUsername(),
                field,
                value
            });

            if (response.success) {
                this.showAlert('修改成功');
                const displayElement = document.getElementById(`${field}-display`);
                if (displayElement) {
                    displayElement.textContent = value;
                }
                this.hideEditForm(field);
            } else {
                this.showAlert('修改失败: ' + response.message);
            }
        } catch (error) {
            this.handleFetchError('修改信息', error);
        }
    }

    async callApi(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    }

    handleFetchError(action, error) {
        console.error(`${action}时出错:`, error);
        this.showAlert(`${action}时出错`);
    }

    showAlert(message) {
        alert(message);
    }

    getCurrentUsername() {
        return localStorage.getItem('username') || 'guest';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new UserProfile();
});