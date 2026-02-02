/* Добавьте эти стили в конец файла styles.css */

/* Кнопки */
.btn-primary {
    background: #667eea;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.3s;
    text-align: center;
}

.btn-primary:hover {
    background: #5a67d8;
}

.btn-secondary {
    background: #e2e8f0;
    color: #4a5568;
    border: none;
    padding: 10px 15px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s;
    text-align: center;
}

.btn-secondary:hover {
    background: #cbd5e0;
}

.btn-danger {
    background: #e53e3e;
    color: white;
}

.btn-danger:hover {
    background: #c53030;
}

.btn-small {
    padding: 6px 12px;
    font-size: 14px;
}

.btn-logout {
    background: #e53e3e;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.3s;
    margin-top: auto;
}

.btn-logout:hover {
    background: #c53030;
}

.btn-link {
    background: none;
    border: none;
    color: #667eea;
    cursor: pointer;
    font-size: inherit;
    text-decoration: underline;
}

.btn-link:hover {
    color: #5a67d8;
}

/* Модальные окна */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
}

.modal-content {
    background: white;
    margin: 5% auto;
    padding: 30px;
    border-radius: 10px;
    width: 90%;
    max-width: 500px;
    position: relative;
}

.modal-close {
    position: absolute;
    right: 20px;
    top: 20px;
    font-size: 28px;
    cursor: pointer;
    color: #718096;
}

.modal-close:hover {
    color: #4a5568;
}

/* Формы в модальных окнах */
.modal-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-weight: 500;
    color: #4a5568;
}

.form-group input,
.form-group select {
    padding: 10px;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #667eea;
}

.form-group input[type="checkbox"] {
    width: auto;
    margin-right: 8px;
}

.form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
}

/* Уведомления */
.notification {
    display: none;
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 6px;
    color: white;
    z-index: 1001;
    animation: slideIn 0.3s ease;
    min-width: 300px;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification.success {
    background: #38a169;
}

.notification.error {
    background: #e53e3e;
}

.notification.warning {
    background: #d69e2e;
}

.notification.info {
    background: #3182ce;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Сообщения об отсутствии данных */
.empty-state {
    text-align: center;
    padding: 40px;
    color: #718096;
    background: white;
    border-radius: 8px;
    border: 2px dashed #e2e8f0;
}

.empty-message {
    text-align: center;
    color: #718096;
    font-style: italic;
    padding: 20px;
}
