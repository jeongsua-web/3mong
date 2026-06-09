package com.fluento;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import jakarta.persistence.EntityManager;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("데이터베이스 연결 테스트")
class DatabaseConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("DataSource 연결 확인")
    void dataSourceConnectionTest() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            assertThat(connection).isNotNull();
            assertThat(connection.isClosed()).isFalse();

            DatabaseMetaData metaData = connection.getMetaData();
            System.out.println("DB Product: " + metaData.getDatabaseProductName());
            System.out.println("DB Version: " + metaData.getDatabaseProductVersion());
            System.out.println("JDBC URL: " + metaData.getURL());
        }
    }

    @Test
    @DisplayName("Hibernate EntityManager 작동 확인")
    void hibernateEntityManagerTest() {
        assertThat(entityManager).isNotNull();
        assertThatCode(() -> entityManager.createNativeQuery("SELECT 1").getSingleResult())
                .doesNotThrowAnyException();
    }
}
